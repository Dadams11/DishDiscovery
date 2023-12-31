const { User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');
const nearbySearch = require('../utils/googlePlaces');




const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password') // exclude the __v and password fields
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        },
        searchRestaurants: async (parent, { term, location }) => {
            const results = await nearbySearch(term, location);
            // console.log(results.results[0]);
            // console.log(results.results[0].geometry);

            return results.results; // return the array of results
        },
        savedRestaurants: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password') // exclude the __v and password fields
                return userData.savedRestaurants;
            }
            throw new AuthenticationError('Not logged in');
        },
    },
    Mutation: {
        loginUser: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw  AuthenticationError;
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw AuthenticationError;
            }
            const token = signToken(user);
            return { token, user };
        },

        addUser:  async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },

        removeRestaurant: async (parent, { restaurantId }, { user }) => {
           // console.log(restaurantId);
            const updatedUser = await User.findOneAndUpdate(
                { _id: user._id },
                { $pull: { savedRestaurants: { place_id: restaurantId } } },
                { new: true }
            );
            console.log(updatedUser);
            return updatedUser;
        },

        saveRestaurant: async (parent, { input }, { user }) => {
            try {
               // console.log(input);
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $addToSet: { savedRestaurants: input } },
                    { new: true, runValidators: true }
                );
                return updatedUser;
            } catch (error) {
                console.error(error);
                throw new Error('Failed to update user');
            }
        },
    },
};

module.exports = resolvers;